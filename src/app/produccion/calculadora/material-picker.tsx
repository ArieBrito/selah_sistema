"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type MaterialOption = { id_material: string; nombre: string; costoUnitario: number };

export function MaterialPicker({
  materiales,
  yaAgregados,
  onSeleccionar,
}: {
  materiales: MaterialOption[];
  yaAgregados: string[];
  onSeleccionar: (material: MaterialOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const disponibles = materiales.filter((m) => !yaAgregados.includes(m.id_material));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="gap-2">
            <Plus className="size-4" /> Agregar material
          </Button>
        }
      />
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar material..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {disponibles.map((m) => (
                <CommandItem
                  key={m.id_material}
                  value={m.nombre}
                  onSelect={() => {
                    onSeleccionar(m);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1">{m.nombre}</span>
                  <span className="text-xs text-muted-foreground">${m.costoUnitario.toFixed(4)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
