const jwt = require("jsonwebtoken");

async function checkToken(req: any, res: any, next: any): Promise<void> {
  try {
    const token =req.headers["authorization"] && req.headers["authorization"].split(" ")[1];
    const result = jwt.verify(token, process.env.ACCES_SECRET);
    if(result){
        req.userEmail = result['email'];
    }
    next()
  } catch (err) {
    res.send(err)
  }
}

export { checkToken };
