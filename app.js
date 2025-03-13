express=require("express");
app=express();
require("dotenv").config();
jwt=require("jsonwebtoken");
mongoose=require("mongoose")
mongoose.connect(process.env.Mongo_URL,{useNewUrlParser:true,useUnifiedTopology:true}).then(()=>{
    console.log("Connected to DB");
});

//event schema
eventScmecha=new mongoose.Schema({
    name:String,
    description:String,
    date:Date,
    time:String,
    category:String,
    user_id:String,
    setReminder:Boolean,
});

eventModel=mongoose.model("event",eventScmecha);

//user schema
userSchema=new mongoose.Schema({
    name:String,
    email:String,
    password:String,
});
usermodel=mongoose.model("user",userSchema);
//authentication middleware
const authenticateUser=((next,req,res)=>{
    if(req.headers.authorization){
        let auth=req.headers.authorization;
        let token=auth.split(" ")[1];
        user=jwt.verify(token,process.env.SECRET_KEY)
        if(user){
            req.user=user;
            next();
        }
        else{
            res.status(400).send({message:"Invalid Token"});
        }
    }
    else{
        req.status(400).send({message:"Empty Token"});
    }
    
});
//signup
app.post("/signup",function(req,res){
    try {
        user=new usermodel(req.body);
        jwt.sign({email:user.email},process.env.SECRET_KEY,(err,token)=>{
            if(err){
                res.status(400).send({message:"Error while creating token"});
            }
            else{
                user.save();
                res.send({message:"User Created",token:token});
            }
        });
        user.save();
        res.send({message:"User Created"});
    } catch (error) {
        res.status(400).send({message:"Error while creating user"});
    }
});
//create event
app.post("event/add",authenticateUser,function(req,res){
    try {
        const {name,description,date,time,category}=req.body;
        newEvent=new eventModel({name,description,date,time,category,user_id:req.user._id,setReminder:false});
        newEvent.save();
    } catch (error) {
        res.status(400).send({message:"Error while saving the event"});
    }
});
//get upcoming events sorted by date
app.get("event/",authenticateUser,function(req,res){
    try {
        currentDate=Date.now();
        events=eventModel.find({date:{$gte:currentDate},user_id:req.user.id}).sort({date:1});
    } catch (error) {
        res.status(400).send({message:"Error while fetching events"});
    }
});
// add reminder
app.post("reminder/add",authenticateUser,function(req,res){
    try {
        const event=eventModel.find({_id:req.body.event_id});
        event.setReminder=true;
        event.save();
    } catch (error) {
        res.status(400).send({message:"Error while saving the reminder"});
    }
});
//get reminders
app.get("/reminder",authenticateUser,function(req,res){
    try {
        currentDate=Date.now();
        events=eventModel.find({date:{$gte:currentDate},user_id:req.user.id}).sort({date:1});
    } catch (error) {
        res.status(400).send({message:"Error while fetching events"});
    }
});
app.listen(3000,(()=>{
    console.log("Server started at 3000");
}));