import { Request, Response,NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const protect = async (req:Request, res: Response, next: NextFunction)=>{
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers as any)
        })
        if(!session || !session?.user){
            return res.status (401).json({message:"unauthorized user"})
        }

        (req as any).userId = session.user.id;
        next()
    } catch (error: any) {
        console.log("Auth Middleware Error:", error);
        res.status(401).json({message: error.code || error.message})
        
    }
} 