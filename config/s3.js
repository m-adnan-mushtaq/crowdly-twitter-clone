// create s3 client and  export it
const { S3Client } = require("@aws-sdk/client-s3")

const client = new S3Client(
    { region:process.env.S3_BUCKET_REGION,
        credentials:{
            accessKeyId:process.env.S3_ACCESS_ID,
            secretAccessKey:process.env.S3_SECRET_KEY
        }
    }
);

module.exports=client