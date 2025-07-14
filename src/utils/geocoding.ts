import axios from 'axios';

export const getAdresseGoogle = async (latitude: number, longitude: number) => {
  try {
    const apiKey = "AIzaSyBdm5JWRvkPgVZefgYeQmlrzoFDdbudDEU"; //  clé API Google
    console.log("Appel API Google Maps pour :", latitude, longitude);

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: apiKey,
          language: 'fr'
        }
      }
    );

    const data = response.data;

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      console.warn('Aucune adresse trouvée ou erreur:', data.status);
      return `${latitude}, ${longitude}`;
    }
  } catch (error) {
    console.error('Erreur API Google Geocoding:', error);
    return `${latitude}, ${longitude}`;
  }
};
