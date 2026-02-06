import User from "../models/User";


// Global middleware for authentication - To attach req.user everywhere
// I.e. if there is an accessToken in request header, find the matching user of it and attach it to every request
export const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization;

    if (!accessToken) {
      return next();
    }

    const matchingUser = await User.findOne({ accessToken: accessToken });

    if (matchingUser) {
      req.user = matchingUser
    } 
    
    next();

  } catch(error) {
    console.error("Optional auth error:", error)
    next();
  }
};


// To be used in routes that should only be accessed by authorized users
export const authenticateUser = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({ loggedOut: true });
  }
  next();
};
