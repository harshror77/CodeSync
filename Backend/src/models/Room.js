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
        joinedAt:{ type:Date, default:Date.now },
        isActive:{ type:Boolean, default:true }
    }],
    maxUsers:{ type:Number, default:2 },
    isActive:{ type:Boolean, default:true },
    lastActivity:{ type:Date, default:Date.now },
},{ timestamps:true })

roomSchema.index({ roomId:1, isActive:1 })

roomSchema.pre('save', function (next) {
    this.lastActivity = new Date()
    next()
})

roomSchema.statics.addUserToRoom = async function (roomId, userId, username='Anonymous') {
    const room = await this.findOne({ roomId })
    if(!room) throw new Error('RoomNotFound')

    const user = room.users.find(
        u => u.userId.toString() === userId.toString()
    )

    if(user){
        Object.assign(user,{
            isActive:true,
            joinedAt:new Date(),
            username
        })
    } else {
        if(room.users.filter(u=>u.isActive).length >= room.maxUsers)
            throw new Error('RoomIsFull')

        room.users.push({ userId, username })
    }

    room.isActive = true
    return await room.save()
}

roomSchema.statics.removeUserFromRoom = async function (roomId, userId) {
    const room = await this.findOne({ roomId })
    if(!room) return null

    const user = room.users.find(
        u => u.userId.toString() === userId.toString()
    )

    if(user) user.isActive = false

    room.isActive = room.users.some(u => u.isActive)
    return await room.save()
}

export const Room = mongoose.model('Room', roomSchema)
