import { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';

export default function EmojiPicker({ triggerRef, onSelect, onClose, isClosing }) { 
  const containerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const btn = triggerRef?.current;
    if (btn && containerRef.current) {
      const r = btn.getBoundingClientRect();
      const W = 352, H = 400; 
      const vw = window.innerWidth, vh = window.innerHeight;
      
      let left = r.left;
      
      if (left + W > vw - 10) {
        left = vw - W - 10;
      }
      
      if (left < 10) left = 10;
      
      let top = r.top - H - 8; 
      if (top < 8) top = r.bottom + 8; 
      
      containerRef.current.style.top = top + 'px';
      containerRef.current.style.left = left + 'px';
      containerRef.current.style.opacity = '1';
    }

    const picker = new Picker({
      data,
      locale: 'fr',
      theme: 'auto',
      previewPosition: 'none',
      skinTonePosition: 'none',
      onEmojiSelect: (emoji) => {
        onSelect(emoji.native);
      },
      onClickOutside: () => {},
    });

    containerRef.current?.appendChild(picker);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        triggerRef?.current && !triggerRef.current.contains(e.target)
      ) onClose();
    };
    setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className={`fixed z-[300] ${isClosing ? 'format-exit' : 'format-enter'}`}
    />
  );
}