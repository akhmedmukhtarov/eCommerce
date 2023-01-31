import {fn} from '../controller/controller'

type User = {
    ID: number;
    Email: string;
    Password: string;
    Token: string | null;
    Role: string;
  };

async function checkRole (req:any,res:any,next:any):Promise<void>{
    const user:User = await fn.getUserByEmail(req.userEmail)
    if(user.Role === 'Admin' || user.Role === 'Moderator'){
        next()
    }
    res.status(401).json({message: 'You\'ve no rights to delete/post/update'})
}


export {checkRole}