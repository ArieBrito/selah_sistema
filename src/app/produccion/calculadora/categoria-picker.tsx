"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2Icon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type CategoriaOption = { id_categoria: number; nombre: string };

export function CategoriaPicker({
  categorias,
  value,
  onSeleccionar,
  onCrear,
}: {
  categorias: CategoriaOption[];
  value: number | null;
  onSeleccionar: (id_categoria: number) => void;
  onCrear: (nombre: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const seleccionada = categorias.find((c) => c.id_categoria === value);

  async function crear() {
    setCreando(true);
    await onCrear(busqueda.trim());
    setCreando(false);
    setBusqueda("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            {seleccionada?.nombre ?? "Selecciona una categoría"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar o crear categoría..." value={busqueda} onValueChange={setBusqueda} />
          <CommandList>
            <CommandEmpty>
              {busqueda.trim() ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-primary hover:underline disabled:opacity-50"
                  onClick={crear}
                  disabled={creando}
                >
                  {creando ? <Loader2Icon className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Crear “{busqueda.trim()}”
                </button>
              ) : (
                "Sin resultados."
              )}
            </CommandEmpty>
            <CommandGroup>
              {categorias.map((c) => (
                <CommandItem
                  key={c.id_categoria}
                  value={c.nombre}
                  onSelect={() => {
                    onSeleccionar(c.id_categoria);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value === c.id_categoria ? "opacity-100" : "opacity-0")} />
                  {c.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
