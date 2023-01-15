import React, { useEffect } from 'react';
import './App.css';
import { MapContainer, TileLayer, useMap, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';



interface Data {
  place_id: number;
  boundingbox: number[];
  lat: string;
  type: string;
  lon: string;
  display_name: string;
  icon: string;
  extratags: {
    population: number;
  },
  namedetails: {
    name: string;
    "name:en": string;
  }

}

type Datas = Data[]

function App() {
  const [search, setSearch] = React.useState('');
  const [data, setData] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [position, setPosition] = React.useState<[number, number]>([42.3601, -71.0589]);
  const [history, setHistory] = React.useState<string[]>(JSON.parse(localStorage.getItem('history') ?? '[]'));
  const [showHistory, setShowHistory] = React.useState(false);
  const [options, setOptions] = React.useState<Datas>([]);



  const autoComplete = async (search: string) => {
    let options: Datas;
    try {
      setLoading(true);
      const response = await fetch(encodeURI(`https://nominatim.openstreetmap.org/search?format=json&limit=10&extratags=1&q=${encodeURI(search)}&namedetails=1`));
      options = await response.json();
      if (options.length > 0) {
        setOptions(options.filter(d => d.type === 'administrative'));
        if (localStorage.getItem('selectFirst') === 'true' && options.length > 0) {
          localStorage.removeItem('selectFirst');
          setData(options[0]);
        }
      }
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }

  }





  //listerners starts


  //for fetching query
  useEffect(() => {

    const url = new URL(window.location.href);
    const search = url.searchParams.get('search');
    if (search) {
      setSearch(search);
    }
    else setSearch('Boston');
    localStorage.setItem('selectFirst', 'true');

  }, []);




  //min 3 characters
  useEffect(() => {
    if (search.length > 2) {
      autoComplete(search);
    }

  }, [search])


  useEffect(() => {
    if (data) {
      setPosition([Number(data.lat), Number(data.lon)]);
      setOptions([]);
      setHistory(history => [...new Set([...history, data.namedetails['name:en'] ?? data.namedetails.name ?? data.display_name])]);
    }
    //eslint-disable-next-line
  }, [data])

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify([...new Set(history)]));
  }, [history]);







  //changing view with animation

  function ChangeView({ center, zoom }) {
    const map = useMap();
    map.flyTo(center, zoom);
    return null;
  }






  return (
    <>

      <div className='flex search-box'>
        <input
          required
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        &nbsp;&nbsp;
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
        >History</button>
      </div>




      {options.length > 0 &&

        <div className="options">
          {loading &&
            <img src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" alt="loading" width={50} />
          }

          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => setData(option)}

            >
              {option.display_name}
            </div>
          ))}
        </div>
      }



      <MapContainer
        className='map'
        center={position} zoom={11}
        scrollWheelZoom={true}
        attributionControl={true}
      >

        <ChangeView center={position} zoom={11} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* show population */}



        {data && (
          <div className="info">
            <b>Information:</b>
            <br />
            <div>
              {data.display_name}
              <br />
              Population: {data.extratags.population ?? 'unknown'}


            </div>
          </div>
        )}

        {data && <Polygon
          positions={[[data.boundingbox[0], data.boundingbox[2]],
          [data.boundingbox[0], data.boundingbox[3]],
          [data.boundingbox[1], data.boundingbox[3]],
          [data.boundingbox[1], data.boundingbox[2]]]} />}






      </MapContainer>



      {showHistory && (
        <div className="history" onClick={() => setShowHistory(false)}>
          <div className='card'>
            <h3>History</h3>
            <hr />
            <div >
              {history.map((item, index) => (
                <div key={index}>
                  <div className='flex-alc' key={index}>
                    <b style={{ fontSize: 20 }} className='flex-1' key={index} onClick={() => {
                      localStorage.setItem('selectFirst', 'true');
                      setSearch(item);
                      setShowHistory(false);
                    }}>{item}</b>
                    <button
                      onClick={(e) => {
                        navigator.clipboard.writeText(`${window.location.host}?search=${encodeURI(item)}`);
                        alert('link copied to clipboard');
                      }}

                      className='btn'>Share</button>

                  </div>
                  <hr />
                </div>

              ))}
            </div>
          </div>
        </div>
      )}



    </>
  );
}

export default App;
