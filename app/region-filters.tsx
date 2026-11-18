'use client';

import { useState } from 'react';
import { Map, MapPin } from './action-icons.ts';

export default function RegionFilters({ districtsByCity, initialCity, initialDistrict }: {
  districtsByCity: Record<string, string[]>;
  initialCity: string;
  initialDistrict: string;
}) {
  const [city, setCity] = useState(initialCity);
  const [district, setDistrict] = useState(initialDistrict);
  const districts = districtsByCity[city] ?? [];
  return <>
    <label><span className="filter-label"><Map size={16} />縣市</span><select name="city" value={city} onChange={(event) => {
      setCity(event.target.value);
      setDistrict('');
    }}>
      <option value="">全臺灣</option>
      {Object.keys(districtsByCity).map((name) => <option key={name}>{name}</option>)}
    </select></label>
    <label><span className="filter-label"><MapPin size={16} />行政區</span><select name="district" value={district} onChange={(event) => setDistrict(event.target.value)}
      disabled={!city}>
      <option value="">全部行政區</option>
      {districts.map((name) => <option key={name}>{name}</option>)}
    </select></label>
  </>;
}
