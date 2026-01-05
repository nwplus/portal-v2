import { Button } from "../ui/button";
import { SELECTABLE_PICTURES } from "./constants";

interface ProfilePicturePickerProps {
  profilePictureIndex: number;
  onSelect: (index: number) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function ProfilePicturePicker({
  profilePictureIndex,
  onSelect,
  onCancel,
  onSave,
}: ProfilePicturePickerProps) {
  return (
    <div className="mx-auto min-h-[500px] max-w-2xl rounded-lg border border-border-subtle bg-[#292929]/30 px-6 py-10 backdrop-blur-md md:p-12">
        <div className="flex justify-center">
          <div className="grid grid-cols-3 place-items-center gap-8">
            {SELECTABLE_PICTURES.map((picture, index) => {
              const actualIndex = index + 1;
              return (
                <button
                  key={actualIndex}
                  type="button"
                  onClick={() => onSelect(actualIndex)}
                  className={`group relative size-24 overflow-hidden rounded-full transition-all hover:scale-105 md:size-36 ${
                    profilePictureIndex === actualIndex
                      ? "ring-4 ring-border-active"
                      : "hover:ring-2 hover:ring-border-subtle"
                  }`}
                >
                  <img
                    src={picture}
                    alt={`Profile ${actualIndex}`}
                    className="size-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      </div>
  );
}