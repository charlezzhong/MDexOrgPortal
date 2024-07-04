import React from 'react';
import { GoogleMap, Marker, useJsApiLoader, LoadScript } from '@react-google-maps/api';
import LocationSearch from './LocationSearch';
import { Address, AddressComponent } from '@/types/address.interface';

const containerStyle = {
  width: '50%',
  height: '400px',
  //margin: 'auto'
};

// center is at Ann Arbor
const center = {
  lat: 42.279594,
  lng: -83.732124,
};

interface GoogleMapComponentProps {
  onSelectAddress: (address: Address) => void;
}


const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ onSelectAddress }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDymiUX4BEEJUWTF3KpDQVeO1Z65twX6Hg", // Replace with your Google Maps API key
    libraries: ['places'], // Specify the libraries that you need, e.g., places
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [marker, setMarker] = React.useState<google.maps.Marker | null>(null);
  const [geocoder, setGeocoder] = React.useState<google.maps.Geocoder | null>(null);
  const [buildingName, setBuildingName] = React.useState<string | undefined>(undefined); // State for buildingName

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  React.useEffect(() => {
    if (isLoaded) {
      setGeocoder(new google.maps.Geocoder());
    }
  }, [isLoaded]);

  React.useEffect(() => {
    if (marker) {
      // Listen to marker dragend event
      google.maps.event.addListener(marker, 'dragend', () => {
        if (marker && marker.getPosition) {
          const newPosition = marker.getPosition();
          const newLat = newPosition.lat();
          const newLng = newPosition.lng();
          
          geocoder.geocode({ location: newPosition }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const addressComponents: { [key: string]: string } = results[0].address_components.reduce((acc: { [key: string]: string }, component: google.maps.GeocoderAddressComponent) => {
                const type = component.types[0];
                acc[type] = component.long_name;
                return acc;
              }, {});

              console.log("results: ", results);

              const newAddress: Address = {
                address: results[0].formatted_address,
                lat: newLat,
                lng: newLng,
                buildingName, // Preserve the existing buildingName
                ...addressComponents,
              };
              onSelectAddress(newAddress);
              console.log(newAddress);
            }
          });
        }
      });
    }
  }, [marker, onSelectAddress]);

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (map && place.geometry && place.geometry.location) {
      map.panTo(place.geometry.location);
      map.setZoom(17); // Set a higher zoom level when a new place is selected
      if (marker) {
        marker.setPosition(place.geometry.location);
      } else {
        const newMarker = new google.maps.Marker({
          position: place.geometry.location,
          map,
          draggable: true, // Make the marker draggable
          title: place.name,
        });
        setMarker(newMarker);
      }
      console.log(place);
      const addressComponents: { [key: string]: string } = place.address_components.reduce((acc: { [key: string]: string }, component: AddressComponent) => {
        const type = component.types[0];
        acc[type] = component.long_name;
        return acc;
      }, {});
  
      const address: Address = {
        address: place.formatted_address!,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        buildingName: place.name, // Add buildingName field
        ...addressComponents
      };
      setBuildingName(place.name); // Update the buildingName state
      onSelectAddress(address);
      console.log("full google map result", place);
      console.log(address);
    }
  };

  return isLoaded ? (
    <div >
      <LocationSearch onSelect={handlePlaceSelect} />
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Optional: Display marker based on initial center */}
        {marker && <Marker position={center} />}
      </GoogleMap>
    </div>
  ) : (
    <p>Loading Google Maps...</p>
  );
};

export default GoogleMapComponent;