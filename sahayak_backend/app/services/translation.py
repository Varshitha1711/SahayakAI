import os
import json
import threading
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
                with _cache_lock:
                    _cache = loaded
        except Exception as e:
            print(f"Error loading translation cache: {e}")
            with _cache_lock:
                _cache = {}
    else:
        with _cache_lock:
            _cache = {}

def save_cache():
    global _cache
    try:
        with _cache_lock:
            cache_copy = _cache.copy()
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache_copy, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving translation cache: {e}")

# Load the cache immediately
load_cache()

def translate_text(text: str, target_lang: str) -> str:
    if not text or not text.strip():
        return text
        
    # Normalize language code (e.g. te-IN -> te)
    lang = target_lang.split("-")[0].lower()
    if lang == "en":
        return text
        
    supported_langs = ["hi", "te", "kn"]
    if lang not in supported_langs:
        return text

    cache_key = f"{lang}:{text}"
    with _cache_lock:
        if cache_key in _cache:
            return _cache[cache_key]

    try:
        # Translate from English to target language
        translated = GoogleTranslator(source='auto', target=lang).translate(text)
        if translated:
            with _cache_lock:
                _cache[cache_key] = translated
            save_cache()
            return translated
    except Exception as e:
        print(f"Translation error for '{text}' to {lang}: {e}")
        
    return text

def translate_scheme(scheme: dict, target_lang: str, lite: bool = False) -> dict:
    if not target_lang:
        return scheme
        
    lang = target_lang.split("-")[0].lower()
    if lang == "en":
        return scheme
        
    translated_scheme = scheme.copy()
    if lite:
        fields_to_translate = ["scheme_name", "benefits", "schemeCategory", "level"]
    else:
        fields_to_translate = ["scheme_name", "details", "benefits", "eligibility", "application", "documents", "schemeCategory", "level"]
    
    for field in fields_to_translate:
        val = scheme.get(field)
        if val and isinstance(val, str):
            translated_scheme[field] = translate_text(val, lang)
            
    return translated_scheme

def translate_scheme_hybrid(scheme: dict, target_lang: str, lite: bool = True, force_sync: bool = False) -> dict:
    if not target_lang:
        return scheme
        
    lang = target_lang.split("-")[0].lower()
    if lang == "en":
        return scheme
        
    fields = ["scheme_name", "benefits", "schemeCategory", "level"] if lite else ["scheme_name", "details", "benefits", "eligibility", "application", "documents", "schemeCategory", "level"]
    
    all_cached = True
    translated_scheme = scheme.copy()
    
    with _cache_lock:
        for field in fields:
            val = scheme.get(field)
            if val and isinstance(val, str):
                cache_key = f"{lang}:{val}"
                if cache_key in _cache:
                    translated_scheme[field] = _cache[cache_key]
                else:
                    all_cached = False
                    
    if all_cached or force_sync:
        return translate_scheme(scheme, target_lang, lite=lite)
    else:
        return translated_scheme
