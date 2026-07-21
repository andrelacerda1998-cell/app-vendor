# Setup local — app-vendor (iOS, simulador)

Passos e armadilhas descobertas ao montar isto pela primeira vez em julho de 2026, com Xcode recente (16.3+). Se estiveres numa versão de Xcode mais antiga, alguns destes problemas podem não aparecer — tenta primeiro sem os patches e só os aplicas se o build falhar com os erros descritos.

## Pré-requisitos

```bash
xcode-select -p            # confirma Xcode CLI tools
brew install cocoapods      # NÃO uses "sudo gem install cocoapods" — falha em Macs
                             # recentes por causa do Ruby do sistema estar desatualizado
pod --version
node -v                     # precisa de Node 18+
```

## Instalar e correr

```bash
npm install
npx expo run:ios
```

Isto faz `expo prebuild` (gera a pasta `ios/`), `pod install`, compila e abre o simulador. A primeira vez demora bastante.

## ⚠️ Erro esperado: `fmt`/consteval (Xcode 16.3+)

Se o build falhar com várias mensagens tipo:
```
call to consteval function 'fmt::basic_format_string<...>::basic_format_string<FMT_COMPILE_STRING, 0>' is not a constant expression
```
é uma incompatibilidade conhecida entre o Xcode novo e a versão do `fmt` (dependência C++ do React Native/folly) usada neste Expo SDK 52. **Não é bug do código**, é o compilador a validar `consteval` de forma mais rígida do que antes.

Corrige editando `ios/Podfile` (gerado pelo `expo prebuild`, por isso esta edição **não é permanente** — perde-se sempre que correres `expo prebuild --clean`; reaplica se isso acontecer). Dentro do bloco `post_install do |installer|`, antes do `end` final, adiciona:

```ruby
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++17'
        end
      end
    end
```

Depois:
```bash
cd ios && pod install && cd ..
npx expo run:ios
```

## `expo-localization` — já corrigido via patch-package

O `switch` sobre `Calendar.Identifier` em Swift não é exaustivo para versões mais recentes do SDK do iOS (adicionaram novos casos). Já está corrigido e versionado (`patches/expo-localization+16.0.1.patch` + `"postinstall": "patch-package"` no `package.json`) — corre automaticamente no `npm install`, não precisas de fazer nada.

## `.env.local` — formato correto (crítico, e não vai para o git)

O `.env.local` está no `.gitignore` — cada pessoa tem de o criar/ajustar localmente. Duas coisas que custaram tempo a descobrir:

1. **`APP_ENV` tem de ser `development`**, não `production`. O `app.config.ts` só lê `EXPO_PUBLIC_DEV_API_DOMAIN`/`PROTOCOL` quando `APP_ENV=development` — com `production` a app ignora-os e vai sempre para `app.piquetapp.com` (produção real!), mesmo que o resto do `.env.local` esteja "certo".
2. **O domínio tem de incluir a porta**: `EXPO_PUBLIC_DEV_API_DOMAIN=127.0.0.1:8000`, não só `127.0.0.1` ou `localhost`. Sem a porta, a app tenta a porta 80 (onde não há nada à escuta) e o login fica preso em "pending" para sempre, sem erro nenhum visível.

Exemplo de `.env.local` funcional para desenvolvimento local:
```
EXPO_PUBLIC_DEV_API_DOMAIN=127.0.0.1:8000
EXPO_PUBLIC_DEV_API_PROTOCOL=http://
APP_ENV=development
GOOGLE_API_KEY_ANDROID=<valor do credentials.zip>
GOOGLE_API_KEY=<valor do credentials.zip>
```

## Login de teste

Usa o utilizador vendor semeado no backend: `user@vendor.com` / `password12345` (ver `SETUP.md` do `backend` — a documentação original diz "password" mas está errada para este utilizador).

## Debug — ver logs/erros reais da app

Se algo falhar silenciosamente (sem erro visível na app): `Cmd+D` no simulador → "Open JS Debugger" → abre uma aba no Chrome com Console e Network. É a forma mais rápida de ver `console.error` e pedidos de rede presos.
