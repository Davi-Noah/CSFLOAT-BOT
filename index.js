import axios from "axios";
import dotenv from "dotenv";
import open from "open";

dotenv.config();

const API_KEY = process.env.CSFLOAT_API_KEY;
const cookie = process.env.CSFLOAT_COOKIE;

const instance = axios.create({
  baseURL: "https://csfloat.com/api/v1/listings", 
  headers: {
    Cookie: `session=${cookie}`,
  },
});

async function getSkins() {
  try {
    const response = await instance.get("", {
      params: {
        min_float: 0.000001,
        min_price: 10,
        max_price: 100,
        sort_by: "highest_discount",
        limit: 5,
        type: "buy_now" 
      },
    });

    const skins = response.data.data;

    if (!skins || skins.length === 0) {
      console.log("Nenhuma skin encontrada.");
      return;
    }

    console.log("Skins disponíveis:");
    skins.forEach((skin) => {
      const price = (skin.price / 100).toFixed(2);
      console.log(`${skin.item.market_hash_name} - $${price}`);
      console.log(`Link: https://csfloat.com/item/${skin.id}\n`);
      open(`https://csfloat.com/item/${skin.id}`);
    });
  } catch (error) {
    console.error("Erro ao buscar skins:", error.response?.data || error.message);
  }
}

getSkins();
