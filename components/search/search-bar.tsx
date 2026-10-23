"use client";

import { Search, X } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  suggestions: readonly string[];
  onChange: (value: string) => void;
}

export function SearchBar({ value, suggestions, onChange }: SearchBarProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const showList = open && suggestions.length > 0;

  const choose = (text: string) => {
    onChange(text);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && showList && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label="Search places, services, and updates in Kawit"
        placeholder="Search places, services, and updates in Kawit..."
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-11 rounded-xl bg-card pr-9 pl-9 text-base shadow-sm md:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => choose("")}
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown fires before the input's blur, so the choice is not lost.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm aria-selected:bg-muted hover:bg-muted"
            >
              <Search className="size-3.5 text-muted-foreground" aria-hidden />
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
