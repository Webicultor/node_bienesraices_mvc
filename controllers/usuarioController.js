import {check, validationResult} from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from "../models/Usuario.js"
import {generarJWT, generarId} from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";

const formularioLogin = function(req, res){
    res.render('auth/login', {
        autenticado: true,
        pagina: 'Entra en tu Cuenta',
        csrfToken: req.csrfToken() 
    });
}

const autenticar = async function(req, res){
    await check('email').isEmail().withMessage('Email no válido').run(req)
    await check('password').notEmpty().withMessage('El Password es obligatorio').run(req)
    let resultado = validationResult(req)
    //res.json(resultado.array());
   
    //console.log(console.log(req.body.password === req.body.repetir_password)) 
    if(!resultado.isEmpty()){
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            errores: resultado.array(),
            csrfToken: req.csrfToken() 
        });
    }    

    const {password, email} = req.body
    const usuario = await Usuario.findOne({ where: {email}})
   
    if (!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Este usuario no existe.'}]
        });
    }
    
    if (!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Usuario no confirmado.'}]
        });
    }
    
    if (!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Password incorrecto.'}]
        });
    }
    const token = generarJWT({id: usuario.id, nombre: usuario.nombre});
    console.log(`JWT: ${token}`)
    return res.cookie('_token', token, {
        httpOnly: true
    }).redirect('/mis-propiedades')
}

const formularioRegistro = function(req, res){
    console.log(req.csrfToken())
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken() 
    });
}

const registrar = async (req, res) => {
    //Validación
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacío').run(req)
    await check('email').isEmail().withMessage('Email no válido').run(req)
    await check('password').isLength({min: 6}).withMessage('Password demasiado corto (min: 6)').run(req)

    await check('repetir_password').equals(req.body.password).withMessage(`Password no confirmado (${req.body.password} vs. ${req.body.repetir_password})`).run(req)
    
    let resultado = validationResult(req)
    //res.json(resultado.array());

    //if(req.body.password !== req.body.repetir_password){
        console.log('Password confirmado? '+ (req.body.password === req.body.repetir_password))
    //}
   
    //console.log(console.log(req.body.password === req.body.repetir_password)) 
    if(!resultado.isEmpty()){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    const {nombre, email, password} = req.body
    const existeUsuario = await Usuario.findOne({ where: {email}})
   
    if (existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Este usuario ya existe.'}],
            usuario: {
                nombre,
                email
            }
        });
    }
    
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })
    
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada',
        mensaje: 'Mensaje de confirmación enviado. Haz click en su enlace para activar tu usuario'
    })
}

const confirmar = async (req, res) => {
    const {token} = req.params;
    const usuario = await Usuario.findOne({where: {token}})
    
    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Usuario incorrecto',
            mensaje: 'Hay un error en confirmación de tu cuenta',
            error: true
        })
    }else{
        usuario.token = null;
        usuario.confirmado = true;
        console.log(usuario);
        await usuario.save();
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Usuario correcto',
            mensaje: 'Cuenta confirmada correctamente',
            error: false
        })
    }
}

const formularioOlvidePassword = function(req, res){
    res.render('auth/olvide-password', {
        csrfToken: req.csrfToken(),
        pagina: 'Recuperar Password'
    });
}

const resetPassword = async (req, res) => {
    //Validación
    await check('email').isEmail().withMessage('Email no válido').run(req)
    
    let resultado = validationResult(req)
   
    //console.log(console.log(req.body.password === req.body.repetir_password)) 
    if(!resultado.isEmpty()){
        return res.render('auth/olvide-password', {
            csrfToken: req.csrfToken(),
            pagina: 'Recuperar Password',
            errores: resultado.array()
        });
    }

    const { email } = req.body
    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario){
        return res.render('auth/olvide-password', {
            csrfToken: req.csrfToken(),
            pagina: 'Recuperar Password',
            errores: [{msg: 'Este email no pertenece a ningún usuario'}]
        });
    }

    usuario.token = generarId();
    await usuario.save();

    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    
    res.render('templates/mensaje', {
        pagina: 'Reestablece tu password',
        mensaje: 'Mensaje de reestablecimiento de password enviado. Haz click en su enlace para continuar el proceso'
    })
}

const comprobarToken = async (req, res) => {
    const { token } = req.params;
    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu password',
            mensaje: 'Hay un error en confirmación de tu cuenta',
            error: true
        })
    } 

    res.render('auth/reset-password', {
        csrfToken: req.csrfToken(),
        pagina: 'Reestablece tu password',
        mensaje: 'Hay un error en confirmación de tu cuenta',
        error: true
    })
}

const nuevoPassword = async (req, res) => {
    
    await check('password').isLength({min: 6}).withMessage('Password demasiado corto (min: 6)').run(req)

    //await check('repetir_password').equals(req.body.password).withMessage(`Password no confirmado (${req.body.password} vs. ${req.body.repetir_password})`).run(req)
    
    let resultado = validationResult(req)
    if(!resultado.isEmpty()){
        return res.render('auth/reset-password', {
            csrfToken: req.csrfToken(),
            pagina: 'Reestablece tu password',
            errores: resultado.array()
        });
    }
   
    const { token } = req.params; 
    const { password } = req.body;
 
    const usuario = await Usuario.findOne({where: {token}})
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password reestablecido',
        mensaje: 'Password registrado correctamente'
    })

    /*if(!usuario){
        return res.render('auth/reset-password', {
            pagina: 'Reestablece tu password',
            mensaje: 'Hay un error en confirmación de tu cuenta',
            error: true
        })
    }*/ 
}

export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}