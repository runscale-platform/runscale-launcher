# runscale-launcher

Дверь для шапки Instagram. Страница лежит на GitHub Pages, адрес `https://x.gderost.ru/launch/?from=<метка>`. Боевые `ultra.runscale.ru` и `gderost.ru` этой выкладкой не меняются.

Ссылка для шапки, со слэшем после `launch`:

- `https://x.gderost.ru/launch/?from=instagram-runscale`
- `https://x.gderost.ru/launch/?from=instagram-stories`
- `https://x.gderost.ru/launch/?from=instagram-izumov`
- `https://x.gderost.ru/launch/?from=telegram-izumov`
- `https://x.gderost.ru/launch/?from=telegram-pavel`

## DNS

У Jino, только имя `x`. Корень `gderost.ru` не трогать.

| тип | имя | значение |
| --- | --- | --- |
| CNAME | x | `runscale-platform.github.io` |

Пока запись не встанет, страница открывается с `https://runscale-platform.github.io/runscale-launcher/launch/`. Метрика там молчит: счётчик включён только на `x.gderost.ru`.

## Метрика

Тот же счётчик `113084253` и те же цели `launch_*`. В настройках счётчика в дополнительные адреса нужно добавить `x.gderost.ru`, иначе визиты с этого имени Метрика выбросит. Ротор забирает их как раньше: в адресе есть `/launch` и метка `from`. Считаются те, кто нажал «Принять все».
