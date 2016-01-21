### A starter template for webpack / static projects

Goal is a streamlined starting point for new static projects. Leans on Webpack
for processing / packaging files as well as local development. Exports into a
static site that can be quickly deployed.

#### Deploy

```sh
heroku create
git push heroku master
```

#### TODO

- Image optimization, source maps, etc.
- Have 'compile-jade' task auto-trigger a page reload
- Better deployment automation
