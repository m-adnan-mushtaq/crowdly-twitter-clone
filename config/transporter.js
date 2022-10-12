const nodemailer=require('nodemailer')

module.exports=async function(email,body){
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_ADDRESS, // generated ethereal user
                pass: process.env.EMAIL_PASSWORD, // generated ethereal password
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        // send mail with defined transport object
        await transporter.sendMail({
            from: '"Crowdly Support Team" <corwdly@support.com>', // sender address
            to: email, // list of receivers
            subject: body.subject, // Subject line
            html: body.message, // html body
        });
    } catch (error) {
        console.log(error.message);
        return error
    }
  

}