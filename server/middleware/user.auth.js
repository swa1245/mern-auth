import jwt from "jsonwebtoken";
const userAuth = async (req, resizeBy, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.json({
      status: false,
      message: "Please login  again",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id) {
      req.body.userId = decoded.id;
    } else {
      return res.json({
        success: false,
        message: "invalid token",
      });
    }
    next();
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
};

export default userAuth;