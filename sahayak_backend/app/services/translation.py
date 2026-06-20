import os
import json
import threading
import tempfile
from deep_translator import GoogleTranslator


# Place cache file in the backend root directory
CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "translations_cache.json")

_cache = {}
_cache_lock = threading.Lock()

def load_cache():
    global _cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                cleaned = {}
                for k, v in loaded.items():
                    if ":" in k:
                        parts = k.split(":", 1)
                        cleaned[f"{parts[0]}:{parts[1].strip()}"] = v.strip() if isinstance(v, str) else v
                    else:
                        cleaned[k] = v
                with _cache_lock:
                    _cache = cleaned
                print(f"Loaded {len(_cache)} translations from persistent cache.")
        except Exception as e:
            print(f"Error loading translation cache: {e}")
            with _cache_lock:
                _cache = {}
    else:
        with _cache_lock:
            _cache = {}

def save_cache():
    print("Saving translation cache...")
    global _cache
    try:
        with _cache_lock:
            cache_copy = _cache.copy()
        # Atomic write to prevent file corruption
        dir_name = os.path.dirname(CACHE_FILE)
        with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, encoding="utf-8") as f:
            json.dump(cache_copy, f, ensure_ascii=False, indent=2)
            temp_name = f.name
        os.replace(temp_name, CACHE_FILE)
    except Exception as e:
        print(f"Error saving translation cache: {e}")

# Load the cache immediately
load_cache()
print("CACHE FILE LOCATION:", CACHE_FILE)

def translate_fields_google(texts: list[str], lang: str) -> list[str]:
    if not texts:
        return []
    
    # Filter empty or whitespace-only texts
    cleaned_texts = [t.strip() for t in texts]
    if not any(cleaned_texts):
        return cleaned_texts
        
    # Batch join using a safe delimiter
    delimiter = "\n---SEP---\n"
    joined_text = delimiter.join(cleaned_texts)
    
    try:
        translated_joined = GoogleTranslator(source='auto', target=lang).translate(joined_text)
        if translated_joined:
            parts = translated_joined.split("---SEP---")
            cleaned_parts = []
            for p in parts:
                p_str = p.strip()
                if p_str.startswith("-") or p_str.endswith("-"):
                    p_str = p_str.strip("-").strip()
                cleaned_parts.append(p_str)
                
            if len(cleaned_parts) == len(cleaned_texts):
                return cleaned_parts
            else:
                print(f"Warning: Google Translate batch split mismatch: expected {len(cleaned_texts)}, got {len(cleaned_parts)}")
    except Exception as e:
        print(f"Google Translate batch translation failed: {e}")
        
    # Fallback to individual translations
    results = []
    for t in cleaned_texts:
        if not t:
            results.append("")
            continue
        try:
            res = GoogleTranslator(source='auto', target=lang).translate(t)
            results.append(res if res else t)
        except Exception as ex:
            print(f"Individual fallback failed for '{t[:20]}...': {ex}")
            results.append(t)
    return results

def translate_text(text: str, target_lang: str) -> str:
    if not text or not text.strip():
        return text

    lang = target_lang.split("-")[0].lower()

    if lang == "en":
        return text

    supported_langs = ["hi", "te", "kn"]
    if lang not in supported_langs:
        return text

    text_stripped = text.strip()
    cache_key = f"{lang}:{text_stripped}"

    with _cache_lock:
        if cache_key in _cache:
            return _cache[cache_key]

    try:
        translated = GoogleTranslator(
            source="auto",
            target=lang
        ).translate(text_stripped)

        if translated:
            with _cache_lock:
                _cache[cache_key] = translated

            save_cache()
            return translated

    except Exception as e:
        print(f"Translation error: {e}")

    return text

def translate_scheme(scheme: dict, target_lang: str, lite: bool = False) -> dict:
    if not target_lang:
        return scheme

    lang = target_lang.split("-")[0].lower()

    if lang == "en":
        return scheme

    supported_langs = ["hi", "te", "kn"]
    if lang not in supported_langs:
        return scheme

    translated_scheme = scheme.copy()

    fields_to_translate = [
        "scheme_name",
        "benefits",
        "schemeCategory"
    ]

    to_translate = {}

    with _cache_lock:
        for field in fields_to_translate:
            val = scheme.get(field)

            if val and isinstance(val, str) and val.strip():
                val_stripped = val.strip()
                cache_key = f"{lang}:{val_stripped}"

                if cache_key in _cache:
                    translated_scheme[field] = _cache[cache_key]
                else:
                    to_translate[field] = val_stripped

    if not to_translate:
        return translated_scheme

    fields_list = list(to_translate.keys())
    texts_list = list(to_translate.values())

    translated_texts = translate_fields_google(
        texts_list,
        lang
    )

    translated_result = {}

    for field, translated in zip(fields_list, translated_texts):
        translated_result[field] = translated

    with _cache_lock:
        for field, orig_val in to_translate.items():
            trans_val = translated_result.get(field)

            if trans_val:
                cache_key = f"{lang}:{orig_val}"
                _cache[cache_key] = trans_val
                translated_scheme[field] = trans_val

    save_cache()

    return translated_scheme

def translate_scheme_hybrid(scheme: dict, target_lang: str, lite: bool = True, force_sync: bool = False) -> dict:
    if not target_lang:
        return scheme
        
    lang = target_lang.split("-")[0].lower()
    if lang == "en":
        return scheme
        
    supported_langs = ["hi", "te", "kn"]
    if lang not in supported_langs:
        return scheme

    translated_scheme = scheme.copy()
    all_fields = ["scheme_name", "details", "benefits", "eligibility", "application", "documents", "schemeCategory", "level"]
    lite_fields = ["scheme_name", "benefits", "schemeCategory", "level"]
    relevant_fields = lite_fields if lite else all_fields

    all_cached = True
    with _cache_lock:
        for field in relevant_fields:
            val = scheme.get(field)
            if val and isinstance(val, str) and val.strip():
                cache_key = f"{lang}:{val.strip()}"
                if cache_key in _cache:
                    translated_scheme[field] = _cache[cache_key]
                else:
                    all_cached = False

    if all_cached:
        return translated_scheme

    # Not fully cached -> actually translate the missing fields instead of
    # silently returning English. Previously this branch returned
    # translated_scheme as-is, leaving uncached fields untranslated forever.
    return translate_scheme(scheme, target_lang, lite=lite)