import React, { useEffect, useRef } from 'react';

function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    const cur = cursorRef.current;
    const trail = trailRef.current;
    if (!cur || !trail) return;

    const onMouseMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
      trail.style.left = mx + 'px';
      trail.style.top = my + 'px';
    };

    const onMouseDown = () => {
      cur.style.width = '6px';
      cur.style.height = '6px';
    };

    const onMouseUp = () => {
      cur.style.width = '12px';
      cur.style.height = '12px';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} id="cursor"></div>
      <div ref={trailRef} id="cursor-trail"></div>
    </>
  );
}

export default CustomCursor;
