# BUILD
FROM node:alpine as buildstage

COPY . /build

WORKDIR /build
RUN npm install

RUN npm run build
RUN mkdir -p /build/public

# copy build output into final image
FROM node:alpine AS release
ENV NODE_ENV=production

WORKDIR /app

COPY --from=buildstage /build/public ./public
COPY --from=buildstage /build/.next/standalone ./
COPY --from=buildstage /build/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
