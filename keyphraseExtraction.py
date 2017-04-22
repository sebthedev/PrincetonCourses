import nltk
from nltk.collocations import *

with open('/Users/Cat/PrincetonCourses/201reviews1.txt', 'r') as myfile:
    text =myfile.read().replace('\n', '')
tokens = nltk.wordpunct_tokenize(text)
bigram_measures = nltk.collocations.BigramAssocMeasures()
trigram_measures = nltk.collocations.TrigramAssocMeasures()
finder = TrigramCollocationFinder.from_words(tokens)
print finder.nbest(trigram_measures.pmi, 20)
