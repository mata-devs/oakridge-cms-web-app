'use client';

import { useState } from "react";
import { IconButton } from "@mui/material";
import { EditOutlined } from "@mui/icons-material";
import { Hotspots } from "@/app/components/helpersAndInputs";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

type AccordionGroupProps = {
  title: string;
  droppableId: string;
  items: Hotspots[];
  selectedHotspot: Hotspots | null;
  setSelectedHotspot: (h: Hotspots | null) => void;
  setOpen: (val: boolean) => void;
  setShowUpdate: (val: boolean) => void;
};

export default function AccordionGroup({
  title,
  droppableId,
  items,
  selectedHotspot,
  setSelectedHotspot,
  setOpen,
  setShowUpdate,
}: AccordionGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!items.length) return null;

  console.log({selectedHotspot})
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      {/* Accordion Header */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between px-4 py-2 bg-[#1b2638] cursor-pointer hover:bg-white/10"
      >
        <span className="text-sm font-semibold text-white/70">{title}</span>
        <span
          className={`transition-transform text-white/60 ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </span>
      </div>

      {/* Accordion Body */}
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? "max-h-[500px]" : "max-h-0"
            }`}
          >
            {/* Vertical branch line running from header down through children */}
            {/* <div className="absolute left-6 top-0 bottom-0 border-l border-white/20"></div> */}

            {items.map((hotspot, index) => {
            const isActive = selectedHotspot?.id === hotspot.id;
            const isLast = index === items.length - 1;

              return (
                <Draggable key={hotspot.id} draggableId={hotspot.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`relative flex items-center justify-between pl-10 pr-4 py-2 border-t border-white/10 hover:bg-white/10 ${
                        isActive ? "bg-white/10" : ""
                      } ${snapshot.isDragging ? "bg-white/20" : ""}`}
                    >
                      {/* horizontal branch connector */}
                      <div className="absolute left-6 top-1/2 w-4 border-t border-white/20"></div>

                      {/* optional vertical connector continuation (except for last child) */}
                      {!isLast && (
                        <div className="absolute left-6 top-0 bottom-0 border-l border-white/20"></div>
                      )}
                      {isLast && (
                        <div className="absolute left-6 top-0 bottom-1/2 border-l border-white/20"></div>
                      )}

                      <span
                        onClick={() => {
                          setSelectedHotspot(hotspot);
                          setOpen(true);
                        }}
                        className="text-white truncate max-w-[150px] md:max-w-[200px] cursor-pointer"
                      >
                        {hotspot.name ?? hotspot.id}
                      </span>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspot(hotspot);
                          setOpen(true);
                          setShowUpdate(true);
                        }}
                      >
                        <EditOutlined className="text-green-400 hover:text-green-500 transition duration-700 ease-in-out" />
                      </IconButton>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
