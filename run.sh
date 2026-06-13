#!/bin/bash

# #region Script de ejecucion GeoFlow Designer | Funcionalidad | menu de opciones para Mac
clear

APP_NAME="GeoFlow Designer"
VERSION="1.0.0"

print_header() {
    echo "============================================"
    echo "  $APP_NAME v$VERSION"
    echo "  Script de ejecucion para macOS"
    echo "============================================"
    echo ""
}

check_node() {
    if ! command -v node &> /dev/null; then
        echo "[ERROR] Node.js no esta instalado."
        echo "  Instala Node.js 16 o superior desde https://nodejs.org"
        exit 1
    fi
    if ! command -v npm &> /dev/null; then
        echo "[ERROR] npm no esta instalado."
        exit 1
    fi
    NODE_VERSION=$(node -v)
    echo "[OK] Node.js $NODE_VERSION detectado"
}

check_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo "[AVISO] Dependencias no instaladas."
        echo "  Ejecutando npm install..."
        echo ""
        npm install
        if [ $? -ne 0 ]; then
            echo "[ERROR] Fallo la instalacion de dependencias."
            exit 1
        fi
        echo ""
        echo "[OK] Dependencias instaladas correctamente."
        echo ""
    fi
}

install_dependencies() {
    echo "Instalando dependencias..."
    echo ""
    npm install
    if [ $? -eq 0 ]; then
        echo ""
        echo "[OK] Dependencias instaladas correctamente."
    else
        echo ""
        echo "[ERROR] Fallo la instalacion de dependencias."
    fi
}

run_dev() {
    check_dependencies
    echo "Iniciando $APP_NAME en modo desarrollo..."
    echo ""
    npm start
}

build_mac() {
    check_dependencies
    echo "Construyendo instalador para macOS..."
    echo ""
    npm run build:mac
    if [ $? -eq 0 ]; then
        echo ""
        echo "[OK] Instalador generado en carpeta dist/"
        echo "  Archivo: dist/*.dmg"
    else
        echo ""
        echo "[ERROR] Fallo la construccion del instalador."
    fi
}

build_all() {
    check_dependencies
    echo "Construyendo instaladores para todas las plataformas..."
    echo ""
    npm run build
    if [ $? -eq 0 ]; then
        echo ""
        echo "[OK] Instaladores generados en carpeta dist/"
    else
        echo ""
        echo "[ERROR] Fallo la construccion."
    fi
}

clean_project() {
    echo "Limpiando proyecto..."
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        echo "  node_modules eliminado"
    fi
    if [ -d "dist" ]; then
        rm -rf dist
        echo "  dist eliminado"
    fi
    echo ""
    echo "[OK] Proyecto limpiado."
}

show_menu() {
    print_header
    check_node
    echo ""
    echo "Selecciona una opcion:"
    echo ""
    echo "  1) Instalar dependencias (npm install)"
    echo "  2) Ejecutar en modo desarrollo (npm start)"
    echo "  3) Construir instalador macOS (npm run build:mac)"
    echo "  4) Construir todas las plataformas (npm run build)"
    echo "  5) Limpiar proyecto (eliminar node_modules y dist)"
    echo "  0) Salir"
    echo ""
}

while true; do
    show_menu
    read -p "  Opcion: " option
    echo ""

    case $option in
        1) install_dependencies ;;
        2) run_dev ;;
        3) build_mac ;;
        4) build_all ;;
        5) clean_project ;;
        0)
            echo "Hasta luego!"
            exit 0
            ;;
        *)
            echo "[ERROR] Opcion no valida."
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
done
# #endregion
