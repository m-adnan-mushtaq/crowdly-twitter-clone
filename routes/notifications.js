const { Router } = require("express");
const router = Router();
const { ensureAuth } = require("../utils/auth");
router.use(ensureAuth);



//--------- FIND ALL NOTIFICATIONS--------------------
router.route("/")
  .get(async (req, res,next) => {
    try {
      
      
      res.render("notifications", {
        title: "Notifications",
        user: req.user,
      });
    } catch (error) {
      next(error)
    }

  })




module.exports = router;

