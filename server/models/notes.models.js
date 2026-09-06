import mongoose from "mongoose";

const notesSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"UserModel",
        required:true
    },
    topic:{
        type:String,
        required:true
    },
    classLevel:String,
    examType:String,
    revidionMode:{
        type:Boolean,
        default:false,
    },
    includeDiagrams:Boolean,
    includeCharts:Boolean,

    content:{
        type:mongoose.Schema.Types.Mixed,  // Ai Response can be of any type, so we use Mixed type
        required:true
    },

    title:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    }
},{timestamps:true});

const NotesModel = mongoose.model("NotesModel", notesSchema);

export default NotesModel;