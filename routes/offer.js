const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");

const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = require("../utils/convertToBase64");

const fileupload = require("express-fileupload");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileupload(),
  async (req, res) => {
    try {
      // console.log(req.body);
      // console.log(req.files);

      // le destructuring

      // const { title } = req.body; // je crée une variable title qui contient ce que contient req.body.title
      // // console.log(title);
      // const { description } = req.body; // je crée une variable description qui contient ce que contient req.body.description
      //  console.log(description);

      // const { banane } = req.body; // si la clé n'existe pas ? unedefined
      // console.log(banane);

      // const title = req.body.title;

      const { title, description, price, brand, city, size, condition, color } =
        req.body;

      const picture = req.files.picture;

      // console.log(picture);

      const savedPicture = await cloudinary.uploader.upload(
        convertToBase64(picture)
      );

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          { COULEUR: color },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: savedPicture,
        owner: req.user._id,
      });

      console.log(newOffer);

      await newOffer.save();

      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);

    const { title, priceMin, priceMax, sort, page } = req.query;

    const limit = 5;

    const filters = {}; // si j'ai title => { product_name : new RegExp(title,"i")}

    // si on m'a envoyé un title alors j'ajoute à filters une clé product_name qui contient ma regexp
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    // si j'ai priceMin => { product_price : { $gte : Number(priceMin) }}
    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    // si j'ai priceMax => { product_price : { $lte : Numver(priceMax) }}
    if (priceMax) {
      // attention : si priceMin existe ! L'objet product_price existe déjà !
      // il ne faut donc pas l'écraser !!!!
      if (priceMin) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        // sinon je crée la clé product_price
        filters.product_price = { $lte: Number(priceMax) };
      }
    }

    // SORTS
    const sortObj = {}; // si j'ai reçu une clé sort alors il faut faire :  { product_price = "asc" ou "desc"}
    if (sort === "price-asc") {
      sortObj.product_price = "asc";
    } else if (sort === "price-desc") {
      sortObj.product_price = "desc";
    }

    // par défaut je suis à la page 1
    let skip = 0;
    // page 1 => (page - 1)*limit => skip 0
    // page 2 => (page - 1)*limit => skip 5
    // page 3 => (page - 1)*limit => skip 10
    // SI J'AI UNE PAGE INDIQUÉE => alors je change skip pour => (page - 1) * limit

    if (page) {
      skip = (page - 1) * limit;
    }

    // console.log(filters);

    const offers = await Offer.find(filters)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("owner", "account");
    // .select("product_name product_price");

    const totalCount = await Offer.countDocuments(filters);
    // const totalCount = await Offer.find(filters).length

    res.json({
      count: totalCount,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
