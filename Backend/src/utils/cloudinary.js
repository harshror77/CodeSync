import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(path)=>{
    try{
        if(!path) return null;
        const response = await cloudinary.uploader.upload(path,{
            resource_type:"auto"
        })
        fs.unlinkSync(path)
        return response;
    }
    catch(e){
        console.log(e);
        fs.unlinkSync(path)
        return null;
    }
}
const deleteFromCloudinary = async(url)=>{
    try{
        if(!url) return;
        const publicId = url.split('/').pop().split('.')[0]
        if(!publicId) return;

        await cloudinary.uploader.destroy(publicId,{
            resource_type:"auto"
        })
    }
    catch(e){
        console.log("error occurrec while deleting the photo")
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}