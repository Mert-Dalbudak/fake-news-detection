# Fake - News

1. First run `npm install`.
2. Make sure you've mongodb and running on your system. If you haven't already install mongodb [here](https://docs.mongodb.com/manual/installation/)
3. Then add the mongodb credentials in `config/app.json`
4. Also add your mail smtp credentials to `config/app.json`
5. Install SpaCy and the pretrained modell

```
pip3 install -U pip setuptools wheel
pip3 install -U spacy
python3 -m spacy download de_core_news_md
```

6. You will need the `.env` file to be able to run the webserver.
Edit the text below as you like and save as `.env` in the root directory.
```
NODE_ENV=development

DOMAIN=localhost
PORT=3000

# SECURITY SETTINGS
SALT_ROUNDS=10
COOKIE_SECRET=a-secret-cookie
SESSION_SECRET=a-very-very-secure-secret-phrase
DB_CONN_IDLE_TIMEOUT=300
REQUEST_TIMEOUT=6000
# SESSION_MAX_AGE=1days * 24hours * 60minutes * 60seconds * 1000milliseconds
SESSION_MAX_AGE=86400000
```
7. Run `npm start` to start the server
8. Open http://localhost:3000
