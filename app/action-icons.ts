import { createElement, type SVGProps } from 'react';
import type { IconData } from 'pulsoicon-core';
import { CalendarDays as CalendarDaysShape } from 'pulsoicon-core/icons/calendar-days';
import { Check as CheckShape } from 'pulsoicon-core/icons/check';
import { ChevronLeft as ChevronLeftShape } from 'pulsoicon-core/icons/chevron-left';
import { ChevronRight as ChevronRightShape } from 'pulsoicon-core/icons/chevron-right';
import { Clock as ClockShape } from 'pulsoicon-core/icons/clock';
import { Database as DatabaseShape } from 'pulsoicon-core/icons/database';
import { Download as DownloadShape } from 'pulsoicon-core/icons/download';
import { House as HouseShape } from 'pulsoicon-core/icons/house';
import { IdCard as IdCardShape } from 'pulsoicon-core/icons/id-card';
import { Image as ImageIconShape } from 'pulsoicon-core/icons/image';
import { Laptop as LaptopShape } from 'pulsoicon-core/icons/laptop';
import { LayoutGrid as LayoutGridShape } from 'pulsoicon-core/icons/layout-grid';
import { LibraryBig as LibraryBigShape } from 'pulsoicon-core/icons/library-big';
import { List as ListShape } from 'pulsoicon-core/icons/list';
import { Map as MapShape } from 'pulsoicon-core/icons/map';
import { MapPin as MapPinShape } from 'pulsoicon-core/icons/map-pin';
import { Moon as MoonShape } from 'pulsoicon-core/icons/moon';
import { Phone as PhoneShape } from 'pulsoicon-core/icons/phone';
import { Plug as PlugShape } from 'pulsoicon-core/icons/plug';
import { Route as RouteShape } from 'pulsoicon-core/icons/route';
import { Search as SearchShape } from 'pulsoicon-core/icons/search';
import { SlidersHorizontal as SlidersHorizontalShape } from 'pulsoicon-core/icons/sliders-horizontal';
import { Sun as SunShape } from 'pulsoicon-core/icons/sun';
import { Timer as TimerShape } from 'pulsoicon-core/icons/timer';
import { Wifi as WifiShape } from 'pulsoicon-core/icons/wifi';
import { X as XShape } from 'pulsoicon-core/icons/x';

function staticIcon({ nodes }: IconData) {
  return function Icon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
    return createElement('svg', {
      'aria-hidden': true, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, width: size, height: size, ...props,
    }, nodes.map(([tag, attributes], index) => createElement(tag, { ...attributes, key: index })));
  };
}

export const CalendarDays = staticIcon(CalendarDaysShape);
export const Check = staticIcon(CheckShape);
export const ChevronLeft = staticIcon(ChevronLeftShape);
export const ChevronRight = staticIcon(ChevronRightShape);
export const Clock = staticIcon(ClockShape);
export const Database = staticIcon(DatabaseShape);
export const Download = staticIcon(DownloadShape);
export const House = staticIcon(HouseShape);
export const IdCard = staticIcon(IdCardShape);
export const ImageIcon = staticIcon(ImageIconShape);
export const Laptop = staticIcon(LaptopShape);
export const LayoutGrid = staticIcon(LayoutGridShape);
export const LibraryBig = staticIcon(LibraryBigShape);
export const List = staticIcon(ListShape);
export const Map = staticIcon(MapShape);
export const MapPin = staticIcon(MapPinShape);
export const Moon = staticIcon(MoonShape);
export const Phone = staticIcon(PhoneShape);
export const Plug = staticIcon(PlugShape);
export const Route = staticIcon(RouteShape);
export const Search = staticIcon(SearchShape);
export const SlidersHorizontal = staticIcon(SlidersHorizontalShape);
export const Sun = staticIcon(SunShape);
export const Timer = staticIcon(TimerShape);
export const Wifi = staticIcon(WifiShape);
export const X = staticIcon(XShape);
