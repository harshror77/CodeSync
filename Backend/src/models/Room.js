import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
    roomId:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    users:[{
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        username:{ type:String, default:'Anonymous' },
        avatar: { type: String, default: "" },
        joinedAt:{ type:Date, default:Date.now },
        isActive:{ type:Boolean, default:true }
    }],
    isActive:{ type:Boolean, default:true },
    lastActivity:{ type:Date, default:Date.now },
},{ timestamps:true })

roomSchema.index({ roomId:1, isActive:1 })

roomSchema.pre('save', function (next) {
    this.lastActivity = new Date()
    next()
})

export const Room = mongoose.model('Room', roomSchema)