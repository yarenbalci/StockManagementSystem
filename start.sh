#!/bin/bash

echo "Starting WebApplication1 on port 5033..."
dotnet run --project WebApplication1/WebApplication1.csproj &

echo "Starting StockManagement.API on port 5156..."
dotnet run --project StockManagement.API/StockManagement.API.csproj &

wait