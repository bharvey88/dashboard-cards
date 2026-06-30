"""Apollo LD2410 Tuning integration.

Serves the bundled dashboard cards + strategy as a frontend module and
registers an auto-generated "MSR Tuning" dashboard in the sidebar. No YAML and
no manual HACS resource registration required.
"""

from __future__ import annotations

import logging
import os

from homeassistant.components import frontend
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    JS_FILENAME,
    JS_URL,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STRATEGY_TYPE,
)

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register the frontend module and the MSR Tuning dashboard."""
    js_file = os.path.join(FRONTEND_DIR, JS_FILENAME)
    if not os.path.exists(js_file):
        _LOGGER.error("Bundled frontend file missing: %s", js_file)
        return False

    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(JS_URL, js_file, False)]
        )
    except (RuntimeError, ValueError):
        # Path already registered (e.g. on reload) — safe to ignore.
        pass

    add_extra_js_url(hass, JS_URL)

    if PANEL_URL_PATH not in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_register_built_in_panel(
            hass,
            "lovelace",
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            frontend_url_path=PANEL_URL_PATH,
            config={"strategy": {"type": STRATEGY_TYPE}},
            require_admin=False,
        )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the MSR Tuning dashboard panel."""
    if PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return True
