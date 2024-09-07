import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'


// login user

const loginUser = async (req, res) => {
    
}

const crateTOken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET)
}

// reigster user

const registerUser = async (req, res) => {
    const {name, password, email} = req.body;
    try {
        // checking if user already exist
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success:false, message:"User already exists."})
        }

        // validating email and strong pass
        if (!validator.isEmail(email)) {
            return res.json({success:false, message:"Please enter a valid email."})
            
        }

        if (password.length<8) {
            return res.json({success:false, messagge:"Password must contain 8 characters or."})
        }

        // hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword
        })

       const user = await newUser.save()
       const token = crateTOken(user._id)
       res.json({success:true, token})

    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

export { loginUser, registerUser}