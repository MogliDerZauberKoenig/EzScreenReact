import { useEffect, useState, useRef } from 'react';

import './Area.css';

const Area = (props) => {
  const [mousePressed, _setMousePressed] = useState(false);
  const [areaStart, _setAreaStart] = useState({ x: 0, y: 0 });
  const [areaEnd, _setAreaEnd] = useState({ x: 0, y: 0 });
  const [areaBounds, _setAreaBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const mousePressedRef = useRef(mousePressed);
  const setMousePressed = (data) => {
    mousePressedRef.current = data;
    _setMousePressed(data);
  };

  const areaStartRef = useRef(areaStart);
  const setAreaStart = (data) => {
    areaStartRef.current = data;
    _setAreaStart(data);
  };

  const areaEndRef = useRef(areaEnd);
  const setAreaEnd = (data) => {
    areaEndRef.current = data;
    _setAreaEnd(data);
  };

  const areaBoundsRef = useRef(areaBounds);
  const setAreaBounds = (data) => {
    areaBoundsRef.current = data;
    _setAreaBounds(data);
  };

  useEffect(() => {
    const handleWindowMousePress = (event) => {
      setAreaStart({
        x: event.clientX,
        y: event.clientY,
      });

      setMousePressed(true);

      console.log(areaStartRef);
    };

    const handleWindowMouseRelease = (event) => {
      setAreaEnd({
        x: event.clientX,
        y: event.clientY,
      });

      window.electron.ipcRenderer.sendMessage('crop_create', { areaStart: areaStartRef, areaEnd: areaEndRef });
    };

    const handleWindowKeyUp = (event) => {
      console.log(event.key);
      if (event.key === 'Escape') {
        window.electron.ipcRenderer.sendMessage('crop_quit');
      }
    };

    const handleWindowMouseMove = (event) => {
      if(!mousePressedRef.current) return;

      let bounds = {
        x: areaStartRef.current.x,
        y: areaStartRef.current.y,
        width: event.clientX - areaStartRef.current.x,
        height: event.clientY - areaStartRef.current.y,
      };
    
      // create normal bounds
      if (bounds.width < 0) {
        bounds.width *= -1;
        bounds.x -= bounds.width;
      }
    
      if (bounds.height < 0) {
        bounds.height *= -1;
        bounds.y -= bounds.height;
      }

      setAreaBounds(bounds);
    };

    window.addEventListener('pointerdown', handleWindowMousePress);
    window.addEventListener('pointerup', handleWindowMouseRelease);
    window.addEventListener('keyup', handleWindowKeyUp);
    window.addEventListener('mousemove', handleWindowMouseMove);
  }, []);

  return (
    <div className='area'>
      <div id='area' style={{ position: 'absolute', backgroundColor: 'lightblue', left: areaBounds.x + 'px', top: areaBounds.y + 'px', width: areaBounds.width + 'px', height: areaBounds.height + 'px' }}></div>
    </div>
  );
};

export default Area;