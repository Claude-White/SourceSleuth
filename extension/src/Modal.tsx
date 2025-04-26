import { useEffect, useRef, useState, type FC } from "react"

import myIcon from "~assets/logo.svg"

interface ModalProps {
  text: string
  onClose: () => void
}

const Modal: FC<ModalProps> = ({ text, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [initialPositionSet, setInitialPositionSet] = useState(false)

  // Set initial position to center of screen
  useEffect(() => {
    if (!initialPositionSet && modalRef.current) {
      setInitialPositionSet(true)
    }
  }, [initialPositionSet])

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - (modalRef.current?.offsetLeft || 0),
      y: e.clientY - (modalRef.current?.offsetTop || 0)
    })
  }

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const onMouseUp = () => {
    setIsDragging(false)
    // We don't reset the position here, so it stays where you dropped it
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
    } else {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [isDragging, dragOffset])

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: initialPositionSet ? `${position.y}px` : "50%",
        left: initialPositionSet ? `${position.x}px` : "50%",
        transform: !initialPositionSet ? "translate(-50%, -50%)" : "none",
        background: "white",
        padding: 24,
        boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
        zIndex: 999999,
        minWidth: 300
      }}>
      <div
        style={{ fontWeight: "bold", cursor: "move", marginBottom: 8 }}
        onMouseDown={onMouseDown}>
        Drag me!
        <button style={{ float: "right" }} onClick={onClose}>
          Close
        </button>
      </div>
      <div
        style={{
          padding: "1rem",
          height: "18rem",
          width: "24rem"
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "0.25rem"
          }}>
          <img src={myIcon} style={{ width: "2rem" }} alt="My Icon" />
          <h1 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
            Source Sleuth
          </h1>
        </div>
        <h1>Received Data:</h1>
        <p>{text}</p>
      </div>
    </div>
  )
}

export default Modal
