import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config({path: '.env'})

const emailRegistro = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS 
        }
      });

    const { email, nombre, token } = datos

    await transport.sendMail({
        from: 'info@bienesraices.com',
        to: email,
        subject: 'Bienvenido a Bienes Raíces',
        text: 'Bienvenido a Bienes Raíces',
        html: `
            <p>Hola ${nombre}, confirma tu cuenta en Bienes Raíces</p>
            
            <p>Clica aquí:
                <a href="${process.env.BACKEND_URL}:${process.env.BACKEND_PORT ?? 3000}/auth/confirmar/${token}">confirmar</a>
            </p>

            <p>Si no has sido tú, ignora el mensaje</p>
            `
    })

}

const emailOlvidePassword = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS 
        }
      });

    const { email, nombre, token } = datos

    await transport.sendMail({
        from: 'info@bienesraices.com',
        to: email,
        subject: 'Bienvenido a Bienes Raíces',
        text: 'Bienvenido a Bienes Raíces',
        html: `
            <p>Hola ${nombre}, has pedido el reset de tu contraseña en Bienes Raíces</p>
            
            <p>Clica aquí:
                <a href="${process.env.BACKEND_URL}:${process.env.BACKEND_PORT ?? 3000}/auth/olvide-password/${token}">Reestablecer password</a>
            </p>

            <p>Si no has sido tú, ignora el mensaje</p>
            `
    })

}

export {
    emailRegistro,
    emailOlvidePassword
}