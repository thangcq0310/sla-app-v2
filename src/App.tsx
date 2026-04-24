
// (Các phần code khác của bạn giữ nguyên)
// ...

      const handleScoreSubmit = async () => {
        if (!selectedVendor || evaluationScores.length === 0) {
          setDialogState({ isOpen: true, title: 'Error', message: 'Please select a vendor and enter scores.', type: 'error' });
          return;
        }

        const scoresData = evaluationScores.map(item => ({
          kpi: item.kpi,
          target: item.target,
          actual: item.actual,
          score: item.score,
          weight: item.weight,
          weightedScore: item.weightedScore
        }));

        try {
          const monthDocId = `${selectedVendor.id}_${evaluationMonth}`;
          const scoreDocRef = doc(db, "vendorScores", monthDocId);
          const docSnap = await getDoc(scoreDocRef);

          if (docSnap.exists()) {
            // Document for this vendor and month already exists, so we update it
            await updateDoc(scoreDocRef, {
              scores: scoresData,
              updatedAt: new Date().toISOString()
            });
             setDialogState({ isOpen: true, title: 'Success', message: `Scores for ${evaluationMonth} have been updated successfully.`, type: 'success' });
          } else {
            // Document doesn't exist, so we create a new one
            await setDoc(scoreDocRef, {
              vendorId: selectedVendor.id,
              vendorName: selectedVendor.name,
              month: evaluationMonth,
              type: selectedVendor.type,
              scores: scoresData,
              createdAt: new Date().toISOString()
            });
            setSubmittedMonths([...submittedMonths, evaluationMonth]);
            setDialogState({ isOpen: true, title: 'Success', message: `Scores for ${evaluationMonth} have been submitted successfully.`, type: 'success' });
          }

          setIsSubmitted(true); // You might want to adjust the logic for this state

        } catch (error: any) {
          setDialogState({ isOpen: true, title: 'Error', message: error.message || 'Failed to submit scores.', type: 'error' });
        }
      };
// ...
// (Các phần code khác của bạn giữ nguyên)
