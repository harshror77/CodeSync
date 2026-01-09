import mongoose from "mongoose"

const fileSchema = new mongoose.Schema({
    roomId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Room',
        index:true
    },
    name:{
        type:String,
        required:true
    },
    path:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:['file','folder'],
        required:true
    },
    content:{
        type:String,
        default:''
    },
    language:{
        type:String
    }
},{ timestamps:true })

fileSchema.index({ roomId:1, path:1 }, { unique:true })

fileSchema.statics.cleanUp = async function(){
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)

    return this.deleteMany({
        updatedAt: { $lt: hourAgo },
        $or: [
            { roomId: { $exists:false } },
            { roomId: null }
        ]
    })
}

export const File = mongoose.model('File', fileSchema)
