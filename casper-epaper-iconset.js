/*
  - Copyright (c) 2014-2017 Neto Ranito & Seabra LDA. All rights reserved.
  -
  - This file is part of casper-epaper.
  -
  - casper-epaper is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-epaper  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-epaper.  If not, see <http://www.gnu.org/licenses/>.
  -
 */
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/

const casperEpaperIconset = document.createElement('template');
casperEpaperIconset.innerHTML = `
  <iron-iconset-svg name="casper-icons" size="24">
    <svg>
      <defs>
        <g id="add-circle">
          <path d="M11 13v3h2v-3h3v-2h-3V8h-2v3H8v2h3zM3 5.993A3.001 3.001 0 0 1 5.993 3h12.014A3.001 3.001 0 0 1 21 5.993v12.014A3.001 3.001 0 0 1 18.007 21H5.993A3.001 3.001 0 0 1 3 18.007V5.993z" fill-rule="evenodd"></path>
        </g>
        <g id="remove-circle">
          <path d="M3 5.993A3.001 3.001 0 0 1 5.993 3h12.014A3.001 3.001 0 0 1 21 5.993v12.014A3.001 3.001 0 0 1 18.007 21H5.993A3.001 3.001 0 0 1 3 18.007V5.993zM16 13v-2H8v2h8z" fill-rule="evenodd"></path>
        </g>
        <g id="clear">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
        </g>
        <g id="search">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
        </g>
        <g id="cancel">
          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"></path>
        </g>
        <g id="date-range">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path>
        </g>
        <g id="arrow-drop-down">
          <path d="M11.56 16.42a.63.63 0 0 0 .44.18.63.63 0 0 0 .45-.18l7.36-6.86a.58.58 0 0 0 .19-.43c0-.15-.07-.3-.2-.42l-1.63-1.53a.7.7 0 0 0-.46-.18.66.66 0 0 0-.45.18L12 12.1 6.74 7.18A.66.66 0 0 0 6.29 7a.7.7 0 0 0-.46.18L4.2 8.71a.58.58 0 0 0-.2.42c0 .16.07.31.2.43l7.36 6.86z"></path>
        </g>
        <g id="clear-combo">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path>
          <path d="M14 12l3-3-2-2-3 3-3-3-2 2 3 3-3 3 2 2 3-3 3 3 2-2-3-3z" fill-opacity="1" stroke="none" fill="#FFF"></path>
        </g>
        <g id="edit-doc">
          <rect stroke="#FFF" x="1.5" y="1.5" width="16" height="21" rx="2"></rect>
          <g stroke="#FFF">
            <path d="M5 5h9v1H5zM5 9h9v1H5zM5 13h9v1H5zM5 17h9v1H5z"></path>
            <path d="M17.984 8.415c.701-.7 1.717-.82 2.282-.255l1.51 1.509c.559.56.445 1.58-.256 2.282l-5.342 5.341-.976.977s-4.018 2.022-4.773 1.267c-.754-.755 1.237-4.803 1.237-4.803l6.318-6.318z" fill-rule="nonzero"></path>
            <path d="M12.722 13.707l3.52 3.55M17 9l3.5 3.5"></path>
          </g>
        </g>
      </defs>
    </svg>
  </iron-iconset-svg>
`;

document.head.appendChild(casperEpaperIconset.content);
