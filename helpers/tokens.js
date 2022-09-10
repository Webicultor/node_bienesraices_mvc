import jwt from 'jsonwebtoken'

const generarId = () => Date.now().toString(32) + Math.random().toString(32).substring(2);

const generarJWT = datos => jwt.sign({id: datos.id, nombre: datos.nombre}, process.env.JWT_SECRET, { expiresIn: '1d' })

export {
    generarId,
    generarJWT
}