const getData = async (url, apiKey) => {
  try {
    const response = await fetch(url, { headers: { Authorization: apiKey } });
    if (response.ok) return await response.json();
  } catch (error) {
    return console.log(error);
  }
};

export default getData;