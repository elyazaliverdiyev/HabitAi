use tauri::Manager;
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  // Single-instance MUST be registered FIRST (before deep-link)
  // With "deep-link" feature enabled, it forwards deep-link URLs to the existing instance
  #[cfg(desktop)]
  {
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      println!("Single-instance: new instance with args: {:?}", argv);
      // Deep link events are already triggered automatically by the plugin
      // But also emit event manually as backup
      for arg in &argv {
        if arg.starts_with("habitai://") {
          let _ = app.emit("deep-link-auth", arg.clone());
        }
      }
      // Focus the existing window
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
      }
    }));
  }

  builder
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      // Register deep-link URL handler in Rust (backup mechanism)
      #[cfg(desktop)]
      {
        let handle = app.handle().clone();
        app.deep_link().on_open_url(move |event| {
          let urls = event.urls();
          println!("Deep-link on_open_url: {:?}", urls);
          for url in urls {
            let url_str = url.to_string();
            if url_str.starts_with("habitai://") {
              let _ = handle.emit("deep-link-auth", url_str);
            }
          }
        });
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
