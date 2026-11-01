"use client";

import { startTransition, useActionState, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CircleAlert, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Field, inputProps } from "@/components/forms/form-kit";
import { teamGroups } from "@/content/team";
import { saveMemberAction, type TeamFormState } from "@/app/admin/actions";

export type MemberFormValues = {
  name: string;
  role: string;
  focus: string;
  group: "leadership" | "engineering";
  bio: string;
  profileUrl: string;
  photo: string | null;
};

const PHOTO_SIZE = 640;
const ACCEPT = "image/jpeg,image/png,image/webp";

/** Center-crops to a square and resizes to 640×640 JPEG in the browser, so uploads are small and consistent. */
async function toSquareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(PHOTO_SIZE, side);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

/** Add or edit a team member. `id` is null when adding. */
export function MemberForm({ id, values }: { id: string | null; values: MemberFormValues }) {
  const [state, action, pending] = useActionState<TeamFormState, FormData>(saveMemberAction.bind(null, id), {});
  const [preview, setPreview] = useState<string | null>(values.photo);
  const [upload, setUpload] = useState("");
  const [removed, setRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const e = state.errors ?? {};
  const fid = (name: string) => `member-${name}`;

  const pick = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.currentTarget.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (!ACCEPT.split(",").includes(file.type)) return setPhotoError("Please choose a JPEG, PNG, or WebP image.");
    if (file.size > 15 * 1024 * 1024) return setPhotoError("Please choose an image under 15 MB.");
    try {
      const dataUrl = await toSquareJpeg(file);
      setPreview(dataUrl);
      setUpload(dataUrl.slice(dataUrl.indexOf(",") + 1));
      setRemoved(false);
    } catch {
      setPhotoError("That image couldn't be read. Please try another file.");
    }
  };
  const remove = () => {
    setPreview(null);
    setUpload("");
    setRemoved(true);
    if (fileInput.current) fileInput.current.value = "";
  };
  // Submit without React's automatic form reset, so nothing typed is lost after a validation error.
  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    data.delete("photoFile");
    startTransition(() => action(data));
  };

  const text = (name: keyof MemberFormValues, label: string, hint?: string, required = true) => (
    <Field id={fid(name)} label={label} hint={hint} required={required} error={e[name as keyof typeof e]}>
      <input name={name} type="text" defaultValue={String(values[name] ?? "")} required={required} {...inputProps(fid(name), e[name as keyof typeof e])} />
    </Field>
  );
  const shownError = photoError ?? e.photo;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {state.error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-danger-600/30 bg-danger-50 p-4 text-sm text-danger-700">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Photo</legend>
        <div className="flex flex-wrap items-center gap-5">
          <div className="size-28 shrink-0 overflow-hidden rounded-full bg-paper ring-1 ring-line">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of a not-yet-uploaded image
              <img src={preview} alt={`Photo preview for ${values.name || "this team member"}`} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs text-slate-600">No photo</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <label className={buttonClasses({ variant: "secondary", className: "cursor-pointer" })}>
                <ImagePlus aria-hidden="true" className="size-4" />
                {preview ? "Change photo" : "Upload photo"}
                <input
                  ref={fileInput}
                  name="photoFile"
                  type="file"
                  accept={ACCEPT}
                  onChange={pick}
                  aria-describedby={`${fid("photo")}-hint${shownError ? ` ${fid("photo")}-error` : ""}`}
                  className="sr-only"
                />
              </label>
              {preview && (
                <button type="button" onClick={remove} className={buttonClasses({ variant: "ghost", className: "text-danger-700 hover:bg-danger-50" })}>
                  <Trash2 aria-hidden="true" className="size-4" />
                  Remove photo
                </button>
              )}
            </div>
            <p id={`${fid("photo")}-hint`} className="text-sm text-slate-600">
              JPEG, PNG, or WebP. It&apos;s cropped to a square and resized automatically — a head-and-shoulders photo works best.
            </p>
            {shownError && (
              <p id={`${fid("photo")}-error`} className="text-sm font-medium text-danger-700">
                {shownError}
              </p>
            )}
          </div>
        </div>
        <input type="hidden" name="photo" value={upload} />
        {removed && <input type="hidden" name="removePhoto" value="on" />}
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold">Profile</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          {text("name", "Full name", "Exactly as the person wants it shown.")}
          {text("role", "Job title", "e.g. Senior Software Engineer")}
        </div>
        {text("focus", "Focus", "One short line about what they work on, e.g. “Software engineering & product delivery”.")}
        <Field id={fid("group")} label="Section" required hint="Where they appear on the About page." error={e.group}>
          <select name="group" defaultValue={values.group} {...inputProps(fid("group"), e.group)}>
            {teamGroups.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fid("bio")} label="Short introduction" hint="Optional · up to 500 characters, written or approved by them." required={false} error={e.bio}>
          <textarea name="bio" rows={4} maxLength={500} defaultValue={values.bio} {...inputProps(fid("bio"), e.bio)} />
        </Field>
        {text("profileUrl", "Profile link", "Optional · e.g. their LinkedIn profile (https://…).", false)}
      </fieldset>

      <div className="space-y-3">
        {id === null && (
          <label className="flex items-start gap-3 rounded-xl bg-paper p-4 ring-1 ring-line">
            <input name="publish" type="checkbox" defaultChecked className="mt-0.5 size-5 shrink-0 accent-cobalt-600" />
            <span className="text-sm text-navy-900">
              <span className="font-semibold">Show on the website now</span> — untick to save it hidden and publish later.
            </span>
          </label>
        )}
        <div>
          <label className="flex items-start gap-3 rounded-xl bg-paper p-4 ring-1 ring-line">
            <input
              name="consent"
              type="checkbox"
              required
              aria-invalid={e.consent ? true : undefined}
              aria-describedby={e.consent ? fid("consent-error") : undefined}
              className="mt-0.5 size-5 shrink-0 accent-cobalt-600"
            />
            <span className="text-sm text-navy-900">
              I confirm this person approved their name, photo, and profile being shown on the website.
            </span>
          </label>
          {e.consent && (
            <p id={fid("consent-error")} className="mt-2 text-sm font-medium text-danger-700">
              {e.consent}
            </p>
          )}
        </div>
      </div>

      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg" })}>
        {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
        {id ? "Save changes" : "Add team member"}
      </button>
    </form>
  );
}
