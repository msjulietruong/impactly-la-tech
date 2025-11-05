import axios from "axios";

const API_BASE_URL = "http://impactly-backend.azurewebsites.net/api/products";
// const API_BASE_URL = "/api/products"; --- IGNORE ---

export const fetchAllProducts = async (input) => {
  try {
    // Determine if input is a barcode (numbers only) or search query
    const isBarcode = /^\d+$/.test(input);

    const params = isBarcode
      ? { upc: input } // If it's all numbers, treat as barcode
      : { q: input }; // Otherwise treat as search query

    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Error:", error.message);
      throw error;
    }
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Error:", error.message);
      throw error;
    }
  }
};

export const fetchProductESG = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/esg`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Error:", error.message);
      throw error;
    }
  }
};

export const fetchProductAlternatives = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/alternatives`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Error:", error.message);
      throw error;
    }
  }
};

export const fetchProductSummary = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/summary`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Error:", error.message);
      throw error;
    }
  }
};
