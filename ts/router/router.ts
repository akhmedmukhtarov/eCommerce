const router = require("express").Router();
import { fn } from "../controller/controller";
import { checkRole } from "../middleware/checkRole";
import { checkToken } from "../middleware/checkToken";

router.post("/register", fn.upload.single("image"), fn.register);

router.post("/login", fn.login);

router.post("/refresh", fn.refreshToken);

router.use(checkToken);

router.get("/getuserinfo", fn.getUserInfo);

router.get("/categories", fn.getCategories);

router.get("/categories/:category", fn.getCategory);

router.get("/categories/:category/:productID", fn.getProductInfo);

router.post("/order", fn.order);

router.use(checkRole);

router.post("/products", fn.upload.array("images", 8), fn.postProduct);

router.delete("/products/:ID", fn.deleteProduct);

export { router };
