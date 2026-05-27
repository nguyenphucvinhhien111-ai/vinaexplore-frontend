import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { locationApi } from "@/api/locationApi";
import type { Location } from "@/types/database";
import useDebounce from "@/hooks/useDebounce";
import LocationDetailModal from "@/components/location/LocationDetailModal";
import useFilterStore from "@/store/useFilterStore";
import { PROVINCES } from "@/utils/constants";

interface SmartSearchbarProps {
  onSelectLocation?: (location: Location) => void;
}

export default function SmartSearchbar({
  onSelectLocation,
}: SmartSearchbarProps) {
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedPrompt = useDebounce(prompt, 500);

  const { selectedTagId } = useFilterStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedPrompt.trim()) return;

    const abortController = new AbortController();

    const fetchResults = async () => {
      setIsLoading(true);
      setIsOpen(true);

      try {
        const [aiResponse, nameResponse] = await Promise.allSettled([
          locationApi.smartSearch(debouncedPrompt),
          locationApi.searchByName(debouncedPrompt),
        ]);

        if (abortController.signal.aborted) return;

        const extractData = (
          response: PromiseSettledResult<Location[] | { data: Location[] }>,
        ): Location[] => {
          if (response.status !== "fulfilled") return [];
          const value = response.value;
          if (value && typeof value === "object" && "data" in value) {
            return Array.isArray(value.data) ? value.data : [];
          }
          return Array.isArray(value) ? value : [];
        };

        const aiResults = extractData(aiResponse);
        const nameResults = extractData(nameResponse);

        const combinedResults = [...nameResults, ...aiResults];

        const uniqueMap = new Map<number, Location>();
        combinedResults.forEach((loc) => {
          if (loc && loc.id && !uniqueMap.has(loc.id)) {
            uniqueMap.set(loc.id, loc);
          }
        });

        setResults(Array.from(uniqueMap.values()));
      } catch (error) {
        console.error("Lỗi Hybrid Search:", error);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      abortController.abort();
    };
  }, [debouncedPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setIsOpen(false);
      console.log("Thực hiện search full:", prompt);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setResults([]);
    setIsOpen(false);
  };

  const currentProvinceName = PROVINCES.find(
    (p) => p.id === selectedTagId,
  )?.name;

  const filteredResults =
    selectedTagId === "All"
      ? results
      : results.filter((loc) =>
          loc.tags?.some((tag: any) =>
            typeof tag === "string"
              ? tag === currentProvinceName
              : tag.id === selectedTagId,
          ),
        );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container hover:bg-surface-container-high rounded-full flex items-center gap-2 border border-outline-variant/60 w-full transition-all duration-300 focus-within:bg-surface focus-within:shadow-md focus-within:border-primary focus-within:hover:bg-surface px-2 py-1.5"
      >
        <Search className="text-outline ml-2 w-5 h-5 flex-shrink-0" />

        <input
          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant py-1 px-1 min-w-0"
          placeholder="e.g., 'mountain climbing...'"
          type="text"
          value={prompt}
          onChange={(e) => {
            const value = e.target.value;
            setPrompt(value);
            if (!value.trim()) {
              setResults([]);
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (prompt.trim()) setIsOpen(true);
          }}
        />

        {prompt && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-outline hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-on-primary px-4 md:px-6 py-2 rounded-full font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-sm whitespace-nowrap flex-shrink-0 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin sm:mr-1" />
          ) : (
            <span className="hidden sm:inline">Search</span>
          )}
          {!isLoading && <Search className="w-4 h-4 sm:hidden" />}
        </button>
      </form>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-surface rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-outline-variant font-body-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tìm kiếm...
            </div>
          ) : filteredResults.length > 0 ? (
            <ul className="flex flex-col">
              {filteredResults.map((location) => (
                <li key={location.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (onSelectLocation) {
                        onSelectLocation(location);
                      } else {
                        setSelectedLocation(location);
                        setIsModalOpen(true);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-surface-container-high transition-colors flex items-start gap-3 border-b border-outline-variant/10 last:border-0"
                  >
                    {location.coverImage ? (
                      <img
                        src={location.coverImage}
                        alt={location.name}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0 bg-surface-container"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-surface-container rounded-md flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-outline" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-label-md text-on-surface truncate">
                        {location.name}
                      </h4>
                      <p className="font-body-sm text-on-surface-variant truncate">
                        {location.address}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-outline-variant font-body-sm">
              Không tìm thấy địa điểm nào phù hợp{" "}
              {selectedTagId !== "All" && `tại ${currentProvinceName}`}.
            </div>
          )}
        </div>
      )}
      <LocationDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={selectedLocation}
      />
    </div>
  );
}
