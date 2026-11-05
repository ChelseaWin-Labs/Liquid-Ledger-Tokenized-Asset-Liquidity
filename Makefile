.PHONY: all setup dev build test lint clean contracts-build contracts-test docker-up docker-down

all: setup build test

setup:
	npm install
	cd backend && npx prisma generate

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

contracts-build:
	cd smart-contracts && cargo build --target wasm32-unknown-unknown --release

contracts-test:
	cd smart-contracts && cargo test

contracts-fmt:
	cd smart-contracts && cargo fmt --all -- --check

contracts-clippy:
	cd smart-contracts && cargo clippy --all-targets -- -D warnings

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf dist build target node_modules
	cd smart-contracts && cargo clean
